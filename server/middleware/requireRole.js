export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user) {
      const error = new Error('No autorizado')
      error.statusCode = 401
      return next(error)
    }

    if (!allowedRoles.includes(request.user.role)) {
      const error = new Error('No tienes permisos suficientes')
      error.statusCode = 403
      return next(error)
    }

    next()
  }
}
