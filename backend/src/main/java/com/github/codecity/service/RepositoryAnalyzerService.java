package com.github.codecity.service;

import org.springframework.stereotype.Service;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.storage.file.FileRepositoryBuilder;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Stream;

@Service
public class RepositoryAnalyzerService {

  public record FileAnalysisResult(
      String fileName,
      String relativePath,
      int linesOfCode,
      int cognitiveComplexity,
      long fileSize,
      long modifiedTime
  ) {}

  public record RepositorySnapshot(
      List<FileAnalysisResult> files,
      Map<String, GridCoordinate> coordinates
  ) {}

  public record GridCoordinate(double x, double z) {}

  private static final int SHALLOW_CLONE_DEPTH = 1;
  private static final int THREAD_POOL_SIZE = 4;

  public RepositorySnapshot analyzeRepository(String repoUrl, File repoDir) throws Exception {
    cloneRepositoryShallow(repoUrl, repoDir);

    List<FileAnalysisResult> files = analyzeFilesAsync(repoDir);
    Map<String, GridCoordinate> coordinates = computeConcentricLayout(files);

    return new RepositorySnapshot(files, coordinates);
  }

  private void cloneRepositoryShallow(String repoUrl, File targetDir) throws Exception {
    if (targetDir.exists()) {
      deleteDirectory(targetDir);
    }

    Git.cloneRepository()
        .setURI(repoUrl)
        .setDirectory(targetDir)
        .setDepth(SHALLOW_CLONE_DEPTH)
        .call()
        .close();
  }

  private List<FileAnalysisResult> analyzeFilesAsync(File repoDir) throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    ConcurrentHashMap<String, FileAnalysisResult> results = new ConcurrentHashMap<>();

    try (Stream<Path> stream = Files.walk(repoDir.toPath())) {
      List<CompletableFuture<Void>> futures = new ArrayList<>();

      stream.filter(Files::isRegularFile)
          .filter(this::isSourceFile)
          .forEach(filePath -> {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
              try {
                String relativePath = repoDir.toPath().relativize(filePath).toString();
                FileAnalysisResult analysis = analyzeFile(filePath, repoDir.toPath());
                results.put(relativePath, analysis);
              } catch (Exception e) {
                // Silently skip unanalyzable files
              }
            }, executor);

            futures.add(future);
          });

      CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    } finally {
      executor.shutdown();
      if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
        executor.shutdownNow();
      }
    }

    return new ArrayList<>(results.values());
  }

  private FileAnalysisResult analyzeFile(Path filePath, Path baseDir) throws Exception {
    byte[] content = Files.readAllBytes(filePath);
    String text = new String(content, StandardCharsets.UTF_8);

    int loc = computeLinesOfCode(text);
    int complexity = computeCognitiveComplexity(text);

    return new FileAnalysisResult(
        filePath.getFileName().toString(),
        baseDir.relativize(filePath).toString(),
        loc,
        complexity,
        filePath.toFile().length(),
        filePath.toFile().lastModified()
    );
  }

  private int computeLinesOfCode(String content) {
    String[] lines = content.split("\n");
    int count = 0;

    for (String line : lines) {
      String trimmed = line.trim();

      // Skip blank lines, single-line comments, and block comment markers
      if (trimmed.isEmpty() || trimmed.startsWith("//") || trimmed.startsWith("*") ||
          trimmed.startsWith("/*") || trimmed.startsWith("*/")) {
        continue;
      }

      count++;
    }

    return Math.max(count, 1);
  }

  private int computeCognitiveComplexity(String content) {
    int complexity = 1;

    complexity += countPattern(content, "if (");
    complexity += countPattern(content, "else if (");
    complexity += countPattern(content, "else {");
    complexity += countPattern(content, "for (");
    complexity += countPattern(content, "foreach");
    complexity += countPattern(content, "while (");
    complexity += countPattern(content, "do {");
    complexity += countPattern(content, "switch (");
    complexity += countPattern(content, "case ");
    complexity += countPattern(content, "catch (");
    complexity += countPattern(content, "try {");
    complexity += countPattern(content, " && ");
    complexity += countPattern(content, " || ");
    complexity += countPattern(content, " ? ");  // ternary
    complexity += countPattern(content, "throw ");
    complexity += countPattern(content, "@Override");  // recursive complexity
    complexity += countPattern(content, "async ");
    complexity += countPattern(content, "await ");

    return Math.max(complexity, 1);
  }

  private int countPattern(String text, String pattern) {
    int count = 0;
    int index = 0;

    while ((index = text.indexOf(pattern, index)) != -1) {
      count++;
      index += pattern.length();
    }

    return count;
  }

  private Map<String, GridCoordinate> computeConcentricLayout(List<FileAnalysisResult> files) {
    Map<String, GridCoordinate> coordinates = new LinkedHashMap<>();

    if (files.isEmpty()) {
      return coordinates;
    }

    // Sort files: core utilities (smaller LOC) near center, larger modules (higher complexity) outward
    List<FileAnalysisResult> sorted = new ArrayList<>(files);
    sorted.sort((a, b) -> {
      int scoreA = a.linesOfCode() + (a.cognitiveComplexity() * 10);
      int scoreB = b.linesOfCode() + (b.cognitiveComplexity() * 10);
      return Integer.compare(scoreA, scoreB);  // Ascending: utilities first
    });

    int totalFiles = sorted.size();
    double gridCellSize = 2.0;
    double maxRadius = Math.max(25, totalFiles * 0.3);

    // Concentric rings: place files in circular bands
    int filesPerRing = Math.max(4, (int) Math.sqrt(totalFiles));
    int ringIndex = 0;
    int fileIndexInRing = 0;

    for (int i = 0; i < sorted.size(); i++) {
      FileAnalysisResult file = sorted.get(i);

      // Calculate ring radius
      double ringRadius = ringIndex * gridCellSize;
      if (ringRadius > maxRadius) {
        ringRadius = maxRadius;
      }

      // Calculate angle around the ring
      double angle = (fileIndexInRing / (double) filesPerRing) * 2 * Math.PI;
      double x = ringRadius * Math.cos(angle);
      double z = ringRadius * Math.sin(angle);

      coordinates.put(file.relativePath(), new GridCoordinate(x, z));

      fileIndexInRing++;
      if (fileIndexInRing >= filesPerRing) {
        fileIndexInRing = 0;
        ringIndex++;
      }
    }

    return coordinates;
  }

  private boolean isSourceFile(Path path) {
    String name = path.getFileName().toString().toLowerCase();
    return name.endsWith(".java") || name.endsWith(".ts") || name.endsWith(".tsx") ||
           name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".py") ||
           name.endsWith(".go") || name.endsWith(".rs") || name.endsWith(".cpp") ||
           name.endsWith(".c") || name.endsWith(".kt") || name.endsWith(".swift") ||
           name.endsWith(".cs") || name.endsWith(".rb") || name.endsWith(".php");
  }

  private void deleteDirectory(File file) throws IOException {
    if (file.isDirectory()) {
      File[] files = file.listFiles();
      if (files != null) {
        for (File f : files) {
          deleteDirectory(f);
        }
      }
    }
    if (!file.delete() && file.exists()) {
      throw new IOException("Failed to delete " + file.getAbsolutePath());
    }
  }
}
