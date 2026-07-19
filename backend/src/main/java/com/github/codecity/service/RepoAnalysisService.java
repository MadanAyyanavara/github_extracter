package com.github.codecity.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.github.codecity.model.*;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.Repository;

@Service
public class RepoAnalysisService {

  @Autowired private GitService gitService;
  @Autowired private CodeMetricsService codeMetricsService;
  @Autowired private ArchitectureAnalysisService architectureAnalysisService;
  @Autowired private GitChurnService gitChurnService;

  public CodeCityAnalysis analyzeRepository(String repoUrl, String commitSha) throws Exception {
    File repoDir = gitService.cloneRepository(repoUrl);
    Repository repository = gitService.openRepository(repoDir);

    try {
      if (commitSha != null) {
        gitService.checkoutCommit(repository, commitSha);
      }

      List<File> sourceFiles = findSourceFiles(repoDir);
      List<CodeCityNode> nodes = new ArrayList<>();
      Map<String, CodeMetricsService.FileMetrics> metricsMap = new HashMap<>();

      for (File file : sourceFiles) {
        CodeMetricsService.FileMetrics metrics = codeMetricsService.analyzeFile(file, repoDir);
        metricsMap.put(file.getAbsolutePath(), metrics);
      }

      String primaryLanguage = determinePrimaryLanguage(metricsMap);
      List<CodeCityEdge> edges = codeMetricsService.extractDependencies(sourceFiles, repoDir);

      int nodeId = 0;
      for (File file : sourceFiles) {
        CodeMetricsService.FileMetrics metrics = metricsMap.get(file.getAbsolutePath());
        double churnScore =
            gitChurnService.calculateChurn(repository, repoDir.toPath().relativize(file.toPath()));

        CodeCityNode node =
            new CodeCityNode(
                "node-" + (++nodeId),
                file.getName(),
                repoDir.toPath().relativize(file.toPath()).toString(),
                metrics.language(),
                metrics.linesOfCode(),
                metrics.cognitiveComplexity(),
                churnScore,
                new Coordinates(0, 0),
                new AiExplainer("", List.of(), ""));

        nodes.add(node);
      }

      ArchitectureAnalysisService.ArchitectureAnalysis archAnalysis =
          architectureAnalysisService.analyzeArchitecture(nodes, edges);

      RepoMetadata metadata =
          new RepoMetadata(
              extractRepoName(repoUrl),
              primaryLanguage,
              archAnalysis.architecturePattern(),
              archAnalysis.executiveSummary());

      return new CodeCityAnalysis(
          metadata,
          new VisualCanvasConfig(50, 50),
          nodes,
          edges,
          new AiDeepDives(archAnalysis.blueprint(), archAnalysis.logicFlows()));

    } finally {
      repository.close();
    }
  }

  private List<File> findSourceFiles(File rootDir) {
    List<File> sourceFiles = new ArrayList<>();
    Queue<File> queue = new LinkedList<>();
    queue.add(rootDir);

    while (!queue.isEmpty()) {
      File dir = queue.poll();
      File[] files = dir.listFiles();

      if (files != null) {
        for (File file : files) {
          if (file.isDirectory() && !file.getName().startsWith(".")) {
            queue.add(file);
          } else if (file.isFile() && isSourceFile(file)) {
            sourceFiles.add(file);
          }
        }
      }
    }

    return sourceFiles;
  }

  private boolean isSourceFile(File file) {
    String name = file.getName().toLowerCase();
    return name.endsWith(".java")
        || name.endsWith(".ts")
        || name.endsWith(".tsx")
        || name.endsWith(".js")
        || name.endsWith(".jsx")
        || name.endsWith(".py")
        || name.endsWith(".go")
        || name.endsWith(".rs")
        || name.endsWith(".cpp")
        || name.endsWith(".c");
  }

  private String determinePrimaryLanguage(Map<String, CodeMetricsService.FileMetrics> metricsMap) {
    Map<String, Integer> langCounts = new HashMap<>();

    for (CodeMetricsService.FileMetrics metrics : metricsMap.values()) {
      langCounts.put(metrics.language(), langCounts.getOrDefault(metrics.language(), 0) + 1);
    }

    return langCounts.entrySet().stream()
        .max(Comparator.comparingInt(Map.Entry::getValue))
        .map(Map.Entry::getKey)
        .orElse("Unknown");
  }

  private String extractRepoName(String repoUrl) {
    String[] parts = repoUrl.split("/");
    String lastPart = parts[parts.length - 1];
    return lastPart.replace(".git", "");
  }
}
