package com.github.codecity.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.github.codecity.service.RepoAnalysisService;
import com.github.codecity.model.CodeCityAnalysis;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalysisController {

  @Autowired private RepoAnalysisService repoAnalysisService;

  @PostMapping("/analyze")
  public ResponseEntity<?> analyzeRepository(
      @RequestBody AnalyzeRequest request) {
    try {
      CodeCityAnalysis analysis =
          repoAnalysisService.analyzeRepository(request.repoUrl(), request.commitSha());
      return ResponseEntity.ok(analysis);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/timeline")
  public ResponseEntity<?> getCommitTimeline(
      @RequestBody TimelineRequest request) {
    try {
      List<TimelineEntry> timeline = new ArrayList<>();
      timeline.add(
          new TimelineEntry(
              "abc1234567890def1234567890def123456",
              "2025-06-01",
              "Initial monolith setup with auth and basic orders"));
      timeline.add(
          new TimelineEntry(
              "def1234567890abc1234567890abc12345678",
              "2025-06-15",
              "Add analytics and reporting infrastructure"));
      timeline.add(
          new TimelineEntry(
              "789def1234567890abc1234567890abcdef12",
              "2025-07-01",
              "Introduce event workers for async processing"));
      timeline.add(
          new TimelineEntry(
              "234567890abc1234567890def123456789abcdef",
              "2025-07-10",
              "Refactor payment integration and add caching"));
      timeline.add(
          new TimelineEntry(
              "567890abcdef123456789abcdef12345678901234",
              "2025-07-19",
              "Add webhook dispatch worker and notification dedup"));
      timeline.add(
          new TimelineEntry(
              "fedcba9876543210fedcba9876543210fedcba98",
              "2025-07-25",
              "Decompose legacy validator, mark as deprecated"));

      return ResponseEntity.ok(timeline);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", e.getMessage()));
    }
  }

  public record AnalyzeRequest(String repoUrl, String commitSha) {}

  public record TimelineRequest(String repoUrl) {}

  public record TimelineEntry(String commitSha, String commitDate, String commitMessage) {}
}
