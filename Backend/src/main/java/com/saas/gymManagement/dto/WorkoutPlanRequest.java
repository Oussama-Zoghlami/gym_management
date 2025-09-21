package com.saas.gymManagement.dto;

import com.saas.gymManagement.models.DifficultyLevel;
import lombok.Data;

import java.util.List;

@Data
public class WorkoutPlanRequest {
    private String title;
    private String description;
    private List<ExerciseDto> exercises;
    private Integer duration;
    private DifficultyLevel difficultyLevel;
    private Integer memberId; // For assignment

    @Data
    public static class ExerciseDto {
        private String name;
        private String description;
        private Integer sets;
        private Integer reps;
        private Integer duration; // in seconds
        private String restTime; // e.g., "30 seconds", "1 minute"
        private String instructions;
    }
}
