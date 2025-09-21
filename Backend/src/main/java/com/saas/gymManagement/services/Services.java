package com.saas.gymManagement.services;

import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import java.util.List;

public interface Services {

    public void approveUser(Integer userId, Role role);
    public void approveAdmin(Integer userId);
    public void rejectUser(Integer userId);
    public void deleteUser(Integer userId);
    public List<User> getPendingUsers();
    public List<User> getAllUsers();
    public void cleanupFacialRecognitionData();

}
