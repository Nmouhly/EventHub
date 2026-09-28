import * as service from "../services/userService.js";
export const list = async (req, res) =>
  res.json(await service.list(req.validated.query));
export const create = async (req, res) =>
  res.status(201).json(await service.create(req.validated.body, req.user.id));
export const update = async (req, res) =>
  res.json(
    await service.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id,
    ),
  );
