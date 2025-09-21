package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.GymCreateRequest;
import com.saas.gymManagement.models.Gym;

public interface GymService {
    Gym createGym(Integer adminId, GymCreateRequest request);
    Gym getMyGym(Integer adminId);
    Gym updateGym(Integer adminId, GymCreateRequest request);
    Gym updateGymByCode(Integer adminId, String code, GymCreateRequest request);
    java.util.List<Gym> listMyGyms(Integer adminId);
    Gym getGymByCode(Integer adminId, String code);
}


