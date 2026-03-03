export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: 'Dados inválidos.',
        issues: result.error.flatten(),
      })
    }
    req.body = result.data
    return next()
  }
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      return res.status(400).json({
        message: 'Filtros inválidos.',
        issues: result.error.flatten(),
      })
    }
    req.query = result.data
    return next()
  }
}
