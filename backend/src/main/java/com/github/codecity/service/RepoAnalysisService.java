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

  @Autowired private RepositoryAnalyzerService repositoryAnalyzerService;
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

      // Use production-grade analyzer service with shallow clone and async processing
      RepositoryAnalyzerService.RepositorySnapshot snapshot =
          repositoryAnalyzerService.analyzeRepository(repoUrl, repoDir);

      List<CodeCityNode> nodes = new ArrayList<>();
      List<CodeCityEdge> edges = new ArrayList<>();

      // Build nodes from file analysis results
      int nodeId = 0;
      Map<String, String> filePathToNodeId = new HashMap<>();

      for (RepositoryAnalyzerService.FileAnalysisResult fileResult : snapshot.files()) {
        String nid = "node-" + (++nodeId);
        filePathToNodeId.put(fileResult.relativePath(), nid);

        String language = detectLanguage(fileResult.fileName());
        double churnScore =
            gitChurnService.calculateChurn(
                repository, Path.of(fileResult.relativePath()));

        RepositoryAnalyzerService.GridCoordinate coord =
            snapshot.coordinates().getOrDefault(
                fileResult.relativePath(),
                new RepositoryAnalyzerService.GridCoordinate(0, 0));

        CodeCityNode node =
            new CodeCityNode(
                nid,
                fileResult.fileName(),
                fileResult.relativePath(),
                language,
                fileResult.linesOfCode(),
                fileResult.cognitiveComplexity(),
                churnScore,
                new Coordinates(coord.x(), coord.z()),
                new AiExplainer("", List.of(), ""));

        nodes.add(node);
      }

      // Extract dependencies between analyzed files
      edges = codeMetricsService.extractDependencies(
          snapshot.files().stream()
              .map(f -> new File(repoDir, f.relativePath()))
              .toList(),
          repoDir);

      String primaryLanguage = determinePrimaryLanguage(nodes);

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

  private String detectLanguage(String fileName) {
    String name = fileName.toLowerCase();
    if (name.endsWith(".java")) return "Java";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "TypeScript";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "JavaScript";
    if (name.endsWith(".py")) return "Python";
    if (name.endsWith(".go")) return "Go";
    if (name.endsWith(".rs")) return "Rust";
    if (name.endsWith(".cpp")) return "C++";
    if (name.endsWith(".c")) return "C";
    if (name.endsWith(".kt")) return "Kotlin";
    if (name.endsWith(".swift")) return "Swift";
    if (name.endsWith(".cs")) return "C#";
    if (name.endsWith(".rb")) return "Ruby";
    if (name.endsWith(".php")) return "PHP";
    return "Unknown";
  }

  private String determinePrimaryLanguage(List<CodeCityNode> nodes) {
    Map<String, Integer> langCounts = new HashMap<>();

    for (CodeCityNode node : nodes) {
      langCounts.put(node.language(), langCounts.getOrDefault(node.language(), 0) + 1);
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
