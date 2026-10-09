export const ok = (res, data, status = 200) => res.status(status).json(data);
export const created = (res, data) => res.status(201).json(data);
