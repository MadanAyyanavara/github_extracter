package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record VisualCanvasConfig(
    @JsonProperty("gridSizeX") int gridSizeX,
    @JsonProperty("gridSizeZ") int gridSizeZ
) {}
