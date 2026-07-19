package com.github.codecity.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.github.codecity.service.RepoAnalysisService;
import com.github.codecity.service.TimelineService;
import com.github.codecity.model.CodeCityAnalysis;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalysisController {

  @Autowired private RepoAnalysisService repoAnalysisService;
  @Autowired private TimelineService timelineService;

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
      List<TimelineService.TimelineEntry> timeline = timelineService.extractTimeline(request.repoUrl(), 6);
      return ResponseEntity.ok(timeline);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", e.getMessage()));
    }
  }

  public record AnalyzeRequest(String repoUrl, String commitSha) {}

  public record TimelineRequest(String repoUrl) {}
}
