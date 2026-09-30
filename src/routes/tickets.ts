import { Router } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
} from '../dal/tickets.js';
import authMiddleware from '../middleware/auth.js';
import { insertTimeLog, getTotalHoursForTicket } from '../dal/timeLogs.js';

const router = Router();

const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];

// TODO: Student implementation - Part 1: Ticket Routes
// GET /tickets
router.get('/', async (req, res) => {
  const limit =
    req.query.limit !== undefined ? Number(req.query.limit) : undefined;
  const offset =
    req.query.offset !== undefined ? Number(req.query.offset) : undefined;
  const status =
    typeof req.query.status === 'string' ? req.query.status : undefined;

  if (
    (limit !== undefined && (Number.isNaN(limit) || limit < 0)) ||
    (offset !== undefined && (Number.isNaN(offset) || offset < 0))
  ) {
    res.status(400).json({ error: 'Invalid pagination parameters' });
    return;
  }

  if (status !== undefined && !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const tickets = await getAllTickets({
    limit,
    offset,
    status,
  });

  res.status(200).json(tickets);
});

// GET /tickets/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await getTicketById(id);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// POST /tickets
router.post('/', authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const creatorId = res.locals.userId;

  if (typeof title !== 'string') {
    res.status(400).json({ error: 'Invalid title' });
    return;
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    res.status(400).json({ error: 'Invalid description' });
    return;
  }

  const ticket = await createTicket({
    title,
    description: description ?? null,
    creator_id: creatorId,
    assignee_id: null,
  });

  res.status(201).json(ticket);
});

// PATCH /tickets/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  if (typeof status !== 'string' || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const ticket = await updateTicketStatus(id, status);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// TODO: Student implementation - Part 2: Time Log Routes
// POST /tickets/:id/time
router.post('/:id/time', authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);
  const userId = res.locals.userId;
  const { hours } = req.body;

  if (!Number.isInteger(ticketId)) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  if (typeof hours !== 'number' || !Number.isInteger(hours) || hours <= 0) {
    res.status(400).json({ error: 'Invalid hours' });
    return;
  }

  const ticket = await getTicketById(ticketId);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const timeLog = await insertTimeLog(ticketId, userId, hours);

  res.status(201).json(timeLog);
});

// GET /tickets/:id/time
router.get('/:id/time', async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId)) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await getTicketById(ticketId);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const totalHours = await getTotalHoursForTicket(ticketId);

  res.status(200).json({
    ticket_id: ticketId,
    total_hours: totalHours,
  });
});

export default router;
