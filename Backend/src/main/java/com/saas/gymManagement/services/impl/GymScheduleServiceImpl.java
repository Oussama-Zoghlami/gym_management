package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.dto.GymScheduleDto;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.GymSchedule;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.repositories.GymScheduleRepository;
import com.saas.gymManagement.services.GymScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GymScheduleServiceImpl implements GymScheduleService {

    private final GymRepository gymRepository;
    private final GymScheduleRepository gymScheduleRepository;

    @Override
    public List<GymScheduleDto> getMyGymSchedule(Integer adminId) {
        Optional<Gym> gymOpt = gymRepository.findByAdminId(adminId);
        if (gymOpt.isEmpty()) return List.of();
        Gym gym = gymOpt.get();
        return gymScheduleRepository.findByGym_IdOrderByIdAsc(gym.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> saveMyGymSchedule(Integer adminId, List<GymScheduleDto> schedules) {
        Optional<Gym> gymOpt = gymRepository.findByAdminId(adminId);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found for admin");
        Gym gym = gymOpt.get();

        // Append the provided list (no delete)
        List<GymSchedule> toSave = new ArrayList<>();
        for (GymScheduleDto dto : schedules) {
            if (dto.getDayOfWeek() == null || dto.getOpenTime() == null || dto.getCloseTime() == null) continue;
            GymSchedule s = GymSchedule.builder()
                    .gym(gym)
                    .dayOfWeek(dto.getDayOfWeek())
                    .openTime(LocalTime.parse(dto.getOpenTime()))
                    .closeTime(LocalTime.parse(dto.getCloseTime()))
                    .note(dto.getNote())
                    .build();
            toSave.add(s);
        }
        List<GymSchedule> saved = gymScheduleRepository.saveAll(toSave);
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> getSchedulesForGym(Integer adminId, Integer gymId) {
        Optional<Gym> gymOpt = gymRepository.findById(gymId);
        if (gymOpt.isEmpty()) return List.of();
        Gym gym = gymOpt.get();
        if (gym.getAdminId() == null || !gym.getAdminId().equals(adminId)) {
            throw new RuntimeException("Unauthorized to access this gym schedules");
        }
        return gymScheduleRepository.findByGym_IdOrderByIdAsc(gymId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> replaceSchedulesForGym(Integer adminId, Integer gymId, List<GymScheduleDto> schedules) {
        Optional<Gym> gymOpt = gymRepository.findById(gymId);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found");
        Gym gym = gymOpt.get();
        if (gym.getAdminId() == null || !gym.getAdminId().equals(adminId)) {
            throw new RuntimeException("Unauthorized to modify this gym schedules");
        }

        gymScheduleRepository.deleteByGym_Id(gymId);

        List<GymSchedule> toSave = new ArrayList<>();
        for (GymScheduleDto dto : schedules) {
            if (dto.getDayOfWeek() == null || dto.getOpenTime() == null || dto.getCloseTime() == null) continue;
            GymSchedule s = GymSchedule.builder()
                    .gym(gym)
                    .dayOfWeek(dto.getDayOfWeek())
                    .openTime(LocalTime.parse(dto.getOpenTime()))
                    .closeTime(LocalTime.parse(dto.getCloseTime()))
                    .note(dto.getNote())
                    .build();
            toSave.add(s);
        }
        List<GymSchedule> saved = gymScheduleRepository.saveAll(toSave);
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> addSchedulesForGym(Integer adminId, Integer gymId, List<GymScheduleDto> schedules) {
        Optional<Gym> gymOpt = gymRepository.findById(gymId);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found");
        Gym gym = gymOpt.get();
        if (gym.getAdminId() == null || !gym.getAdminId().equals(adminId)) {
            throw new RuntimeException("Unauthorized to modify this gym schedules");
        }

        List<GymSchedule> toSave = new ArrayList<>();
        for (GymScheduleDto dto : schedules) {
            if (dto.getDayOfWeek() == null || dto.getOpenTime() == null || dto.getCloseTime() == null) continue;
            GymSchedule s = GymSchedule.builder()
                    .gym(gym)
                    .dayOfWeek(dto.getDayOfWeek())
                    .openTime(LocalTime.parse(dto.getOpenTime()))
                    .closeTime(LocalTime.parse(dto.getCloseTime()))
                    .note(dto.getNote())
                    .build();
            toSave.add(s);
        }
        List<GymSchedule> saved = gymScheduleRepository.saveAll(toSave);
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> getSchedulesForGymCode(Integer adminId, String code) {
        Optional<Gym> gymOpt = gymRepository.findByAdminIdAndCode(adminId, code);
        if (gymOpt.isEmpty()) return List.of();
        Gym gym = gymOpt.get();
        return gymScheduleRepository.findByGym_IdOrderByIdAsc(gym.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<GymScheduleDto> addSchedulesForGymCode(Integer adminId, String code, List<GymScheduleDto> schedules) {
        Optional<Gym> gymOpt = gymRepository.findByAdminIdAndCode(adminId, code);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found for admin/code");
        Gym gym = gymOpt.get();
        List<GymSchedule> toSave = new ArrayList<>();
        for (GymScheduleDto dto : schedules) {
            if (dto.getDayOfWeek() == null || dto.getOpenTime() == null || dto.getCloseTime() == null) continue;
            GymSchedule s = GymSchedule.builder()
                    .gym(gym)
                    .dayOfWeek(dto.getDayOfWeek())
                    .openTime(LocalTime.parse(dto.getOpenTime()))
                    .closeTime(LocalTime.parse(dto.getCloseTime()))
                    .note(dto.getNote())
                    .build();
            toSave.add(s);
        }
        List<GymSchedule> saved = gymScheduleRepository.saveAll(toSave);
        return saved.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public void deleteScheduleForGymCode(Integer adminId, String code, Long scheduleId) {
        Optional<Gym> gymOpt = gymRepository.findByAdminIdAndCode(adminId, code);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found for admin/code");
        Integer gymId = gymOpt.get().getId();
        gymScheduleRepository.findById(scheduleId).ifPresent(s -> {
            if (!s.getGym().getId().equals(gymId)) throw new RuntimeException("Schedule does not belong to this gym");
            gymScheduleRepository.deleteById(scheduleId);
        });
    }

    @Override
    public void deleteScheduleForGym(Integer adminId, Integer gymId, Long scheduleId) {
        Optional<Gym> gymOpt = gymRepository.findById(gymId);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found");
        Gym gym = gymOpt.get();
        if (gym.getAdminId() == null || !gym.getAdminId().equals(adminId)) {
            throw new RuntimeException("Unauthorized to delete this gym's schedule");
        }
        // Ensure the row belongs to that gym; then delete by id
        gymScheduleRepository.findById(scheduleId).ifPresent(s -> {
            if (!s.getGym().getId().equals(gymId)) {
                throw new RuntimeException("Schedule does not belong to this gym");
            }
            gymScheduleRepository.deleteById(scheduleId);
        });
    }

    @Override
    public void deleteMySchedule(Integer adminId, Long scheduleId) {
        // Find gym by admin, then ensure the schedule belongs to it
        Optional<Gym> gymOpt = gymRepository.findByAdminId(adminId);
        if (gymOpt.isEmpty()) throw new RuntimeException("Gym not found for admin");
        Integer gymId = gymOpt.get().getId();
        gymScheduleRepository.findById(scheduleId).ifPresent(s -> {
            if (!s.getGym().getId().equals(gymId)) {
                throw new RuntimeException("Schedule does not belong to your gym");
            }
            gymScheduleRepository.deleteById(scheduleId);
        });
    }

    @Override
    public List<GymScheduleDto> getPublicSchedulesForGym(Integer gymId) {
        // Public method for members - no admin ownership check
        return gymScheduleRepository.findByGym_IdOrderByIdAsc(gymId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private GymScheduleDto toDto(GymSchedule s) {
        GymScheduleDto dto = new GymScheduleDto();
        dto.setId(s.getId());
        dto.setDayOfWeek(s.getDayOfWeek());
        dto.setOpenTime(s.getOpenTime() != null ? s.getOpenTime().toString() : null);
        dto.setCloseTime(s.getCloseTime() != null ? s.getCloseTime().toString() : null);
        dto.setNote(s.getNote());
        return dto;
    }
}


