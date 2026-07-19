package com.github.codecity.service;

import org.springframework.stereotype.Service;
import com.github.codecity.model.CodeCityNode;
import com.github.codecity.model.CodeCityEdge;
import com.github.codecity.model.LogicIntersect;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.model.anthropic.AnthropicChatModel;
import java.util.*;

@Service
public class ArchitectureAnalysisService {

  public record ArchitectureAnalysis(
      String architecturePattern,
      String executiveSummary,
      String blueprint,
      List<LogicIntersect> logicFlows) {}

  private final ArchitectureAnalyzer architectureAnalyzer;

  public ArchitectureAnalysisService() {
    String apiKey = System.getenv("ANTHROPIC_API_KEY");
    if (apiKey == null || apiKey.isEmpty()) {
      this.architectureAnalyzer = null;
    } else {
      var model = AnthropicChatModel.builder().apiKey(apiKey).modelName("claude-3-5-sonnet-20241022").build();
      this.architectureAnalyzer = AiServices.create(ArchitectureAnalyzer.class, model);
    }
  }

  public ArchitectureAnalysis analyzeArchitecture(List<CodeCityNode> nodes, List<CodeCityEdge> edges) {
    if (architectureAnalyzer == null) {
      return getDefaultAnalysis();
    }

    try {
      StringBuilder nodesSummary = new StringBuilder();
      for (CodeCityNode node : nodes) {
        nodesSummary
            .append(node.fileName())
            .append(" (")
            .append(node.linesOfCode())
            .append(" LOC, complexity: ")
            .append(node.cognitiveComplexity())
            .append(")\n");
      }

      StringBuilder edgesSummary = new StringBuilder();
      for (CodeCityEdge edge : edges) {
        edgesSummary
            .append(edge.sourceNodeId())
            .append(" -> ")
            .append(edge.targetNodeId())
            .append(" (")
            .append(edge.dependencyType())
            .append(")\n");
      }

      String prompt =
          "Analyze this repository structure:\n\nFiles:\n"
              + nodesSummary
              + "\n\nDependencies:\n"
              + edgesSummary
              + "\n\nProvide: 1) Architecture pattern (one line), 2) Executive summary (2-3 sentences), 3) Detailed architecture blueprint (paragraph), 4) Two key logic flows.";

      String response = architectureAnalyzer.analyzeRepository(prompt);

      return parseAnalysisResponse(response, nodes, edges);
    } catch (Exception e) {
      return getDefaultAnalysis();
    }
  }

  private ArchitectureAnalysis parseAnalysisResponse(
      String response, List<CodeCityNode> nodes, List<CodeCityEdge> edges) {
    String pattern = extractLine(response, "Pattern:");
    String summary = extractLine(response, "Summary:");
    String blueprint = extractParagraph(response, "Blueprint:");

    List<LogicIntersect> flows = new ArrayList<>();
    flows.add(
        new LogicIntersect(
            "Primary Data Flow",
            "Data flows from entry points through service layer to data access layer"));
    flows.add(
        new LogicIntersect(
            "Dependency Chain",
            "Core business logic depends on utility modules and external dependencies"));

    return new ArchitectureAnalysis(
        pattern.isEmpty() ? "Layered Architecture" : pattern,
        summary.isEmpty() ? "A modular system with clear separation of concerns" : summary,
        blueprint.isEmpty()
            ? "The system follows a layered architecture pattern with clear separation between presentation, business logic, and data access layers."
            : blueprint,
        flows);
  }

  private String extractLine(String text, String prefix) {
    int idx = text.indexOf(prefix);
    if (idx == -1) return "";

    int start = idx + prefix.length();
    int end = text.indexOf("\n", start);
    return end == -1 ? text.substring(start).trim() : text.substring(start, end).trim();
  }

  private String extractParagraph(String text, String prefix) {
    int idx = text.indexOf(prefix);
    if (idx == -1) return "";

    int start = idx + prefix.length();
    int end = text.indexOf("\n\n", start);
    return end == -1 ? text.substring(start).trim() : text.substring(start, end).trim();
  }

  private ArchitectureAnalysis getDefaultAnalysis() {
    return new ArchitectureAnalysis(
        "Layered Architecture",
        "A modular system with clear separation of concerns across multiple layers.",
        "The system follows a layered architecture pattern with clear separation between presentation, business logic, and data access layers. Each layer has distinct responsibilities and communicates through well-defined interfaces.",
        List.of(
            new LogicIntersect(
                "Request Processing",
                "Incoming requests are routed through controllers to services and eventually reach data access layers."),
            new LogicIntersect(
                "Data Consistency",
                "Data modifications flow through service layer validation before persisting to the data access layer.")));
  }

  public interface ArchitectureAnalyzer {
    String analyzeRepository(String repositoryDescription);
  }
}
