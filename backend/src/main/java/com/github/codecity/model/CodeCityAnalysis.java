package com.github.codecity.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CodeCityAnalysis(
    @JsonProperty("repoMetadata") RepoMetadata repoMetadata,
    @JsonProperty("visualCanvasConfig") VisualCanvasConfig visualCanvasConfig,
    @JsonProperty("nodes") List<CodeCityNode> nodes,
    @JsonProperty("edges") List<CodeCityEdge> edges,
    @JsonProperty("aiDeepDives") AiDeepDives aiDeepDives
) {}
