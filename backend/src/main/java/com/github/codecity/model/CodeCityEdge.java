package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CodeCityEdge(
    @JsonProperty("id") String id,
    @JsonProperty("sourceNodeId") String sourceNodeId,
    @JsonProperty("targetNodeId") String targetNodeId,
    @JsonProperty("dependencyType") String dependencyType,
    @JsonProperty("aiDescription") String aiDescription
) {}
