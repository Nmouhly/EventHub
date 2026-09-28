import * as service from "../services/registrationService.js";
export const list = async (req, res) =>
  res.json(await service.list(req.validated.query));
export const create = async (req, res) =>
  res.status(201).json(await service.create(req.validated.body));
export const updateStatus = async (req, res) =>
  res.json(
    await service.updateStatus(
      req.validated.params.id,
      req.validated.body.status,
    ),
  );
