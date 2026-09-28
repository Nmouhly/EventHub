import * as service from "../services/eventService.js";
export const list = async (req, res) =>
  res.json(await service.list(req.validated.query));
export const get = async (req, res) =>
  res.json(await service.get(req.validated.params.id));
export const create = async (req, res) =>
  res.status(201).json(await service.create(req.validated.body, req.user.id));
export const update = async (req, res) =>
  res.json(await service.update(req.validated.params.id, req.validated.body));
export const updateStatus = async (req, res) =>
  res.json(
    await service.updateStatus(
      req.validated.params.id,
      req.validated.body.status,
    ),
  );
