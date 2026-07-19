package com.github.codecity.service;

import org.springframework.stereotype.Service;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.stmt.IfStmt;
import com.github.javaparser.ast.stmt.ForStmt;
import com.github.javaparser.ast.stmt.WhileStmt;
import com.github.javaparser.ast.stmt.SwitchStmt;
import com.github.codecity.model.CodeCityEdge;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@Service
public class CodeMetricsService {

  public record FileMetrics(
      String language,
      int linesOfCode,
      int cognitiveComplexity) {}

  public FileMetrics analyzeFile(File file, File baseDir) throws Exception {
    String content = new String(Files.readAllBytes(file.toPath()));
    String language = detectLanguage(file);
    int loc = countLinesOfCode(content);
    int complexity = analyzeCognitivComplexity(content, language);

    return new FileMetrics(language, loc, complexity);
  }

  public List<CodeCityEdge> extractDependencies(List<File> sourceFiles, File baseDir) {
    List<CodeCityEdge> edges = new ArrayList<>();
    int edgeId = 0;

    Map<String, String> fileIdMap = new HashMap<>();
    int i = 1;
    for (File file : sourceFiles) {
      fileIdMap.put(file.getAbsolutePath(), "node-" + i);
      i++;
    }

    for (File file : sourceFiles) {
      try {
        String content = new String(Files.readAllBytes(file.toPath()));
        String sourceId = fileIdMap.get(file.getAbsolutePath());
        Set<String> importedModules = extractImports(content);

        for (String module : importedModules) {
          File matchingFile = findFileByModule(sourceFiles, module);
          if (matchingFile != null) {
            String targetId = fileIdMap.get(matchingFile.getAbsolutePath());
            edges.add(
                new CodeCityEdge(
                    "edge-" + (++edgeId),
                    sourceId,
                    targetId,
                    "import",
                    "Imports " + module));
          }
        }
      } catch (Exception e) {
        // Skip files that can't be analyzed
      }
    }

    return edges;
  }

  private String detectLanguage(File file) {
    String name = file.getName().toLowerCase();
    if (name.endsWith(".java")) return "Java";
    if (name.endsWith(".ts")) return "TypeScript";
    if (name.endsWith(".tsx")) return "TypeScript";
    if (name.endsWith(".js")) return "JavaScript";
    if (name.endsWith(".jsx")) return "JavaScript";
    if (name.endsWith(".py")) return "Python";
    if (name.endsWith(".go")) return "Go";
    if (name.endsWith(".rs")) return "Rust";
    if (name.endsWith(".cpp")) return "C++";
    if (name.endsWith(".c")) return "C";
    return "Unknown";
  }

  private int countLinesOfCode(String content) {
    String[] lines = content.split("\n");
    int count = 0;

    for (String line : lines) {
      String trimmed = line.trim();
      if (!trimmed.isEmpty() && !trimmed.startsWith("//") && !trimmed.startsWith("*")) {
        count++;
      }
    }

    return Math.max(count, 1);
  }

  private int analyzeCognitivComplexity(String content, String language) {
    int complexity = 1;

    complexity += countOccurrences(content, "if (");
    complexity += countOccurrences(content, "else if (");
    complexity += countOccurrences(content, "else {");
    complexity += countOccurrences(content, "for (");
    complexity += countOccurrences(content, "while (");
    complexity += countOccurrences(content, "do {");
    complexity += countOccurrences(content, "switch (");
    complexity += countOccurrences(content, "case ");
    complexity += countOccurrences(content, "catch (");
    complexity += countOccurrences(content, " && ");
    complexity += countOccurrences(content, " || ");

    return Math.max(complexity, 1);
  }

  private int countOccurrences(String text, String pattern) {
    int count = 0;
    int index = 0;

    while ((index = text.indexOf(pattern, index)) != -1) {
      count++;
      index += pattern.length();
    }

    return count;
  }

  private Set<String> extractImports(String content) {
    Set<String> imports = new HashSet<>();
    String[] lines = content.split("\n");

    for (String line : lines) {
      String trimmed = line.trim();
      if (trimmed.startsWith("import ") && trimmed.endsWith(";")) {
        String importName = trimmed.substring(7, trimmed.length() - 1);
        imports.add(importName);
      }
    }

    return imports;
  }

  private File findFileByModule(List<File> files, String module) {
    for (File file : files) {
      if (file.getAbsolutePath().contains(module.replace(".", File.separator))) {
        return file;
      }
    }
    return null;
  }
}
