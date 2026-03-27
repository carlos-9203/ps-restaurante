package model;

import java.util.Date;

public record Usuario(String id, String username, String contraseña, Rol rol, Date fecha_creacion) { }
