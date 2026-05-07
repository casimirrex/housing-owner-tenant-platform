package com.housing.ownertenantapi.service;

import com.housing.ownertenantapi.dto.FileUploadResponse;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles uploaded listing-photo files (Bug G.3).
 *
 * Files are saved to a configured directory (defaults to /app/uploads in the
 * backend container, mounted as a Docker volume so they persist across rebuilds).
 *
 * The original filename is intentionally NOT used on disk — we generate a UUID
 * name with the original extension so user-supplied filenames can never escape
 * the upload directory and we never collide on duplicate names.
 *
 * Validation:
 *   - Content type must be image/jpeg or image/png (anti-malicious-upload).
 *   - File extension must match (.jpg, .jpeg, .png).
 *   - Size cap is enforced upstream by Spring multipart config (5MB).
 *   - Empty / missing files are rejected.
 */
@Service
public class FileUploadService {

  private static final Set<String> ALLOWED_CONTENT_TYPES =
      Set.of("image/jpeg", "image/png", "image/jpg");

  private static final Set<String> ALLOWED_EXTENSIONS =
      Set.of("jpg", "jpeg", "png");

  private final Path uploadDir;
  private final String publicBasePath;

  public FileUploadService(
      @Value("${app.uploads.dir:/app/uploads}") String uploadDirRaw,
      @Value("${app.uploads.public-base-path:/uploads}") String publicBasePath
  ) {
    this.uploadDir = Paths.get(uploadDirRaw).toAbsolutePath().normalize();
    this.publicBasePath = publicBasePath.endsWith("/")
        ? publicBasePath.substring(0, publicBasePath.length() - 1)
        : publicBasePath;
  }

  @PostConstruct
  void ensureUploadDir() {
    try {
      Files.createDirectories(uploadDir);
    } catch (IOException e) {
      throw new IllegalStateException(
          "Could not create uploads directory at " + uploadDir, e);
    }
  }

  /**
   * Save the uploaded file under a UUID name and return its public URL + metadata.
   * Throws 400 if the file is missing, the wrong type, or has a disallowed extension.
   */
  public FileUploadResponse storeListingPhoto(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "No file was uploaded. Please pick an image (.jpg or .png) and try again."
      );
    }

    String contentType = file.getContentType() == null
        ? ""
        : file.getContentType().toLowerCase(Locale.ROOT);
    if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Only JPG and PNG images are allowed. Got: " + (contentType.isEmpty() ? "unknown" : contentType)
      );
    }

    String originalFilename = file.getOriginalFilename() == null
        ? "upload"
        : file.getOriginalFilename();
    String extension = extractExtension(originalFilename, contentType);
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Unsupported file extension. Use .jpg, .jpeg, or .png."
      );
    }

    String storedFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
    Path target = uploadDir.resolve(storedFilename).normalize();

    // Defensive: target must stay under the upload directory.
    if (!target.startsWith(uploadDir)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Invalid filename."
      );
    }

    try {
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    } catch (IOException e) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Could not save the upload. Please try again.",
          e
      );
    }

    String publicUrl = publicBasePath + "/" + storedFilename;
    return new FileUploadResponse(publicUrl, originalFilename, storedFilename, file.getSize());
  }

  /** Public for the static-resource handler — exposes where files live on disk. */
  public Path getUploadDir() {
    return uploadDir;
  }

  /** Public for the static-resource handler — base URL prefix that maps to the dir. */
  public String getPublicBasePath() {
    return publicBasePath;
  }

  private static String extractExtension(String filename, String contentType) {
    int dotIdx = filename.lastIndexOf('.');
    if (dotIdx > 0 && dotIdx < filename.length() - 1) {
      return filename.substring(dotIdx + 1).toLowerCase(Locale.ROOT);
    }
    // Fallback: derive from content type
    if ("image/png".equals(contentType)) return "png";
    if ("image/jpeg".equals(contentType) || "image/jpg".equals(contentType)) return "jpg";
    return "";
  }
}
