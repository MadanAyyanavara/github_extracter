package com.github.codecity.service;

import org.springframework.stereotype.Service;
import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.lib.ObjectId;
import java.nio.file.Path;
import java.util.*;

@Service
public class GitChurnService {

  public double calculateChurn(Repository repository, Path filePath) {
    try (Git git = new Git(repository)) {
      String pathStr = filePath.toString().replace("\\", "/");
      int commits =
          (int)
              git.log()
                  .addPath(pathStr)
                  .call()
                  .stream()
                  .limit(100)
                  .count();

      return Math.min(commits / 50.0, 1.0);
    } catch (Exception e) {
      return 0.1;
    }
  }
}
