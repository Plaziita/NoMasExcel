package com.nomasexcel.backend.controller;

import com.nomasexcel.backend.model.User;
import com.nomasexcel.backend.util.JwtUtil;
import com.nomasexcel.backend.service.userService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class authController {

    @Autowired
    private userService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body, HttpServletResponse response) {
        String email = body.get("email");
        String password = body.get("password");

        Optional<User> userOpt = userService.login(email, password);

        if (userOpt.isPresent()) {
            String token = jwtUtil.generateToken(email);

            Cookie cookie = new Cookie("jwt", token);
            cookie.setHttpOnly(true);
            cookie.setSecure(false); // ⚠️ poner true en producción con HTTPS
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60); // 1 hora
            // cookie.setDomain("localhost"); // ⚠️ eliminar en desarrollo, causa problemas
            response.addCookie(cookie);

            return Map.of("message", "Login exitoso");
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return Map.of("error", "Credenciales inválidas");
        }
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        try {
            User newUser = userService.register(user);
            return Map.of("message", "Usuario registrado", "user", newUser);
        } catch (RuntimeException e) {
            return Map.of("error", e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0); // eliminar cookie
        response.addCookie(cookie);

        return Map.of("message", "Logout exitoso");
    }

    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        String email = null;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    String token = cookie.getValue();
                    if (jwtUtil.validateToken(token)) {
                        email = jwtUtil.extractEmail(token);
                    }
                }
            }
        }

        if (email != null) {
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return Map.of(
                    "authenticated", true,
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "rol", user.getRol()
                );
            }
        }
        return Map.of("authenticated", false);
    }
}
