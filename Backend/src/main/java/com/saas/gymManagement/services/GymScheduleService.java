package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.GymScheduleDto;

import java.util.List;

public interface GymScheduleService {
    List<GymScheduleDto> getMyGymSchedule(Integer adminId);
    List<GymScheduleDto> saveMyGymSchedule(Integer adminId, List<GymScheduleDto> schedules);

    // By gym id (with admin ownership check)
    List<GymScheduleDto> getSchedulesForGym(Integer adminId, Integer gymId);
    List<GymScheduleDto> replaceSchedulesForGym(Integer adminId, Integer gymId, List<GymScheduleDto> schedules);
    List<GymScheduleDto> addSchedulesForGym(Integer adminId, Integer gymId, List<GymScheduleDto> schedules);
    void deleteScheduleForGym(Integer adminId, Integer gymId, Long scheduleId);
    void deleteMySchedule(Integer adminId, Long scheduleId);

    // By gym code (with admin ownership check)
    List<GymScheduleDto> getSchedulesForGymCode(Integer adminId, String code);
    List<GymScheduleDto> addSchedulesForGymCode(Integer adminId, String code, List<GymScheduleDto> schedules);
    void deleteScheduleForGymCode(Integer adminId, String code, Long scheduleId);

    // Public method for members (no admin ownership check)
    List<GymScheduleDto> getPublicSchedulesForGym(Integer gymId);
}


