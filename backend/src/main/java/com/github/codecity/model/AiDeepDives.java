package com.github.codecity.model;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public record AiDeepDives(
    @JsonProperty("architectureBlueprint") String architectureBlueprint,
    @JsonProperty("logicIntersects") List<LogicIntersect> logicIntersects
) {}
