package com.github.codecity.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LogicIntersect(
    @JsonProperty("flowName") String flowName,
    @JsonProperty("description") String description
) {}
