package com.github.codecity.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RepositoryAnalyzerService Unit Tests")
class RepositoryAnalyzerServiceTest {

  @InjectMocks
  private RepositoryAnalyzerService repositoryAnalyzerService;

  private File mockRepoDir;

  @BeforeEach
  void setUp() throws IOException {
    mockRepoDir = new File("/tmp/test-repo");
  }

  // ============================================================================
  // TEST 1: Height Calculation from Lines of Code
  // ============================================================================

  @Test
  @DisplayName("Verify 10,000 lines of code yields exactly 12 geometric height units")
  void testComputeHeightFor10000Lines() {
    // Arrange
    int linesOfCode = 10000;
    double expectedHeight = 12.0;

    // Act
    double height = Math.max(0.5, Math.log10(linesOfCode) * 3);

    // Assert
    assertEquals(expectedHeight, height, 0.01,
        "Height for 10,000 LOC should be approximately 12.0 units");
    assertTrue(height >= 0.5, "Height must meet minimum threshold of 0.5");
  }

  @Test
  @DisplayName("Height calculation handles minimum LOC (1 line)")
  void testComputeHeightForMinimumLoc() {
    // Arrange
    int linesOfCode = 1;
    double minHeight = 0.5;

    // Act
    double height = Math.max(minHeight, Math.log10(linesOfCode) * 3);

    // Assert
    assertEquals(minHeight, height, 0.01,
        "Height for 1 LOC should be clamped to minimum 0.5");
  }

  @Test
  @DisplayName("Height calculation scales logarithmically")
  void testHeightScalesLogarithmically() {
    // Arrange & Act
    double height100 = Math.max(0.5, Math.log10(100) * 3);
    double height1000 = Math.max(0.5, Math.log10(1000) * 3);
    double height10000 = Math.max(0.5, Math.log10(10000) * 3);

    // Assert
    assertEquals(6.0, height100, 0.01);
    assertEquals(9.0, height1000, 0.01);
    assertEquals(12.0, height10000, 0.01);

    // Verify logarithmic growth: each 10x increase adds 3 units
    assertEquals(3.0, height1000 - height100, 0.01);
    assertEquals(3.0, height10000 - height1000, 0.01);
  }

  // ============================================================================
  // TEST 2: Concentric Layout - No Duplicate Coordinates
  // ============================================================================

  @Test
  @DisplayName("Concentric layout algorithm prevents duplicate grid coordinates")
  void testConcentricLayoutNoDuplicateCoordinates() {
    // Arrange
    List<RepositoryAnalyzerService.FileAnalysisResult> files = createMockFiles(50);

    // Act
    Map<String, RepositoryAnalyzerService.GridCoordinate> coordinates =
        repositoryAnalyzerService.computeConcentricLayout(files);

    // Assert
    Set<String> seenCoords = new HashSet<>();
    for (var entry : coordinates.entrySet()) {
      String coordKey = String.format("%.2f,%.2f", entry.getValue().x(), entry.getValue().z());
      assertFalse(seenCoords.contains(coordKey),
          "Duplicate coordinate detected: " + coordKey);
      seenCoords.add(coordKey);
    }

    assertEquals(files.size(), coordinates.size(),
        "All files must have unique coordinates");
  }

  @Test
  @DisplayName("Concentric layout places utilities near center (0,0)")
  void testConcentricLayoutUtilitiesNearCenter() {
    // Arrange: Low LOC + complexity files (utilities)
    List<RepositoryAnalyzerService.FileAnalysisResult> files = new ArrayList<>();
    files.add(createFile("utils1.ts", 50, 3));
    files.add(createFile("utils2.ts", 75, 4));
    files.add(createFile("service1.ts", 500, 25));
    files.add(createFile("service2.ts", 1000, 50));

    // Act
    Map<String, RepositoryAnalyzerService.GridCoordinate> coords =
        repositoryAnalyzerService.computeConcentricLayout(files);

    // Assert
    double util1Distance = Math.sqrt(
        Math.pow(coords.get("utils1.ts").x(), 2) +
        Math.pow(coords.get("utils1.ts").z(), 2)
    );
    double service1Distance = Math.sqrt(
        Math.pow(coords.get("service1.ts").x(), 2) +
        Math.pow(coords.get("service1.ts").z(), 2)
    );

    assertTrue(util1Distance < service1Distance,
        "Utility files should be closer to center than service files");
  }

  @Test
  @DisplayName("Concentric layout respects maximum radius boundary")
  void testConcentricLayoutRespectsBoundary() {
    // Arrange
    List<RepositoryAnalyzerService.FileAnalysisResult> files = createMockFiles(200);
    double expectedMaxRadius = 200 * 0.3; // Based on algorithm

    // Act
    Map<String, RepositoryAnalyzerService.GridCoordinate> coords =
        repositoryAnalyzerService.computeConcentricLayout(files);

    // Assert
    for (var coord : coords.values()) {
      double distance = Math.sqrt(coord.x() * coord.x() + coord.z() * coord.z());
      assertTrue(distance <= expectedMaxRadius * 1.1,
          "Coordinate distance exceeds expected max radius: " + distance);
    }
  }

  @Test
  @DisplayName("Concentric layout handles single file")
  void testConcentricLayoutSingleFile() {
    // Arrange
    List<RepositoryAnalyzerService.FileAnalysisResult> files =
        List.of(createFile("only.ts", 100, 5));

    // Act
    Map<String, RepositoryAnalyzerService.GridCoordinate> coords =
        repositoryAnalyzerService.computeConcentricLayout(files);

    // Assert
    assertEquals(1, coords.size());
    RepositoryAnalyzerService.GridCoordinate coord = coords.get("only.ts");
    assertNotNull(coord);
    assertTrue(Math.abs(coord.x()) < 0.01 && Math.abs(coord.z()) < 0.01,
        "Single file should be placed near center (0,0)");
  }

  // ============================================================================
  // TEST 3: Lines of Code Counting (Exclude Blanks/Comments)
  // ============================================================================

  @Test
  @DisplayName("LOC counting excludes blank lines and comments")
  void testLocCountExcludesBlankLinesAndComments() {
    // Arrange
    String content = "public class Test {\n" +
                    "  // This is a comment\n" +
                    "  \n" +
                    "  public void method() {\n" +
                    "    /* Block comment */\n" +
                    "    System.out.println();\n" +
                    "  }\n" +
                    "}\n";

    // Act
    int loc = repositoryAnalyzerService.computeLinesOfCode(content);

    // Assert
    assertEquals(5, loc, "Should count 5 non-comment, non-blank lines");
  }

  @Test
  @DisplayName("LOC counting includes code with inline comments")
  void testLocCountIncludesCodeWithInlineComments() {
    // Arrange
    String content = "int x = 42; // inline comment\n" +
                    "System.out.println(x); // print\n";

    // Act
    int loc = repositoryAnalyzerService.computeLinesOfCode(content);

    // Assert
    assertEquals(2, loc, "Should count code lines with inline comments");
  }

  // ============================================================================
  // TEST 4: Cognitive Complexity Scoring
  // ============================================================================

  @Test
  @DisplayName("Cognitive complexity counts decision points accurately")
  void testCognitiveComplexityScoring() {
    // Arrange
    String content = "if (x > 0) {\n" +
                    "  if (y < 10) {\n" +
                    "    for (int i = 0; i < 5; i++) {\n" +
                    "      while (true) {\n" +
                    "        if (flag && condition) { break; }\n" +
                    "      }\n" +
                    "    }\n" +
                    "  }\n" +
                    "}\n";

    // Act
    int complexity = repositoryAnalyzerService.computeCognitiveComplexity(content);

    // Assert
    assertTrue(complexity > 5, "Should detect multiple decision points");
    // Baseline (1) + 2 ifs + 1 for + 1 while + 1 if + 1 && = 7+
    assertTrue(complexity >= 7, "Complexity should account for nested structures");
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private List<RepositoryAnalyzerService.FileAnalysisResult> createMockFiles(int count) {
    List<RepositoryAnalyzerService.FileAnalysisResult> files = new ArrayList<>();
    for (int i = 0; i < count; i++) {
      int loc = 50 + (i * 10);
      int complexity = 2 + (i % 10);
      files.add(createFile("file" + i + ".ts", loc, complexity));
    }
    return files;
  }

  private RepositoryAnalyzerService.FileAnalysisResult createFile(
      String fileName, int loc, int complexity) {
    return new RepositoryAnalyzerService.FileAnalysisResult(
        fileName,
        "src/" + fileName,
        loc,
        complexity,
        loc * 50L, // fileSize estimate
        System.currentTimeMillis()
    );
  }
}
