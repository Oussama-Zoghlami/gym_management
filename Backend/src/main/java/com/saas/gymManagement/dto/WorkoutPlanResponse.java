package com.saas.gymManagement.dto;

import com.saas.gymManagement.models.DifficultyLevel;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class WorkoutPlanResponse {
    private Long id;
    private String title;
    private String description;
    private List<ExerciseDto> exercises;
    private Integer duration;
    private DifficultyLevel difficultyLevel;
    private String coachName;
    private String gymName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class ExerciseDto {
        private String name;
        private String description;
        private Integer sets;
        private Integer reps;
        private Integer duration;
        private String restTime;
        private String instructions;
    }
}
