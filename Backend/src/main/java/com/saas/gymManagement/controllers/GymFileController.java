package com.saas.gymManagement.controllers;

import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.GymPhoto;
import com.saas.gymManagement.repositories.GymRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/gym")
public class GymFileController {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Autowired
    private GymRepository gymRepository;

    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping("/{gymId}/photos")
    public ResponseEntity<List<String>> uploadPhotos(@PathVariable Integer gymId,
                                                     @RequestParam("files") List<MultipartFile> files) throws IOException {
        Gym gym = gymRepository.findById(gymId).orElseThrow();
        Path base = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(String.valueOf(gymId));
        Files.createDirectories(base);

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String original = StringUtils.cleanPath(file.getOriginalFilename());
            String filename = System.currentTimeMillis() + "_" + original;
            Path target = base.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            String url = "/uploads/" + gymId + "/" + filename;

            GymPhoto photo = new GymPhoto();
            photo.setGym(gym);
            photo.setUrl(url);
            gym.getPhotos().add(photo);
            urls.add(url);
        }
        gymRepository.save(gym);
        return ResponseEntity.ok(urls);
    }
}


