package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record Coordinates(
    @JsonProperty("x") double x,
    @JsonProperty("z") double z
) {}
