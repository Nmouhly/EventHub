import * as service from "../services/participantService.js";
export const list = async (req, res) =>
  res.json(await service.list(req.validated.query));
export const get = async (req, res) =>
  res.json(await service.get(req.validated.params.id));
export const create = async (req, res) =>
  res.status(201).json(await service.create(req.validated.body));
export const update = async (req, res) =>
  res.json(await service.update(req.validated.params.id, req.validated.body));
export const remove = async (req, res) => {
  await service.remove(req.validated.params.id);
  res.status(204).end();
};
