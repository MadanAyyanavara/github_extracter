package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CodeCityNode(
    @JsonProperty("id") String id,
    @JsonProperty("fileName") String fileName,
    @JsonProperty("relativePath") String relativePath,
    @JsonProperty("language") String language,
    @JsonProperty("linesOfCode") int linesOfCode,
    @JsonProperty("cognitiveComplexity") int cognitiveComplexity,
    @JsonProperty("gitChurnScore") double gitChurnScore,
    @JsonProperty("coordinates") Coordinates coordinates,
    @JsonProperty("aiExplainer") AiExplainer aiExplainer
) {}
