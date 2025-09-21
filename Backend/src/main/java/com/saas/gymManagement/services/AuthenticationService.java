package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.*;
import com.saas.gymManagement.models.User;

public interface AuthenticationService {
    User signup(SignUpRequest signUpRequest);
    JwtAuthenticationResponse signin(SignInRequest signinRequest);
    JwtAuthenticationResponse signinFacial(FacialSignInRequest facialRequest);
    JwtAuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest);
    public User signupAdmin(SignUpRequestAdmin requestAdmin);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
