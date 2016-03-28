import { Router } from 'express';
import Membership from '../models/membership';
import User from '../models/user';
import scopify from '../helpers/scopify';
import { needs, needsApprovedIndex, needsApprovedOne } from '../middleware/permissions';
import verifyUser from '../middleware/verify-user';
import paginate from '../middleware/paginate';

const router = Router(); // eslint-disable-line new-cap

router
  .route('/')
    .get(verifyUser, paginate, needsApprovedIndex('memberships'), (req, res, next) => {
      const scopes = scopify(req.query, 'reason', 'committee', 'user', 'active', 'between', 'approved');
      Membership
        .scope(scopes)
        .findAndCountAll({
          include: User,
        })
        .then(result => res.send({
          total: result.count,
          perPage: req.query.perPage,
          currentPage: req.query.page,
          data: result.rows,
        }))
        .catch(err => next(err));
    })
    .post(needs('memberships', 'create'), (req, res, next) => {
      User
        .findOrCreate({ where: { dce: req.body.user.dce } })
        .spread(user => {
          if (!user.firstName && !user.lastName) {
            user.firstName = req.body.user.firstName;
            user.lastName = req.body.user.lastName;
          }
          return user.save();
        })
        .then( user => {
          req.body.userDce = user.dce;
          return Membership
            .create(req.body, {
              fields: ['reason', 'committeeName', 'userDce', 'startDate', 'endDate'],
            });
        })
        .then(membership => res.status(201).send(membership))
        .catch(err => {
          err.status = 422;
          next(err);
        });
    });

router
  .route('/:id')
    .get(verifyUser, needsApprovedOne('memberships'), (req, res, next) => {
      Membership
        .findById(req.params.id)
        .then(membership => {
          if (membership) {
            if (!membership.approved && !req.auth.allowed) {
              return Promise.reject({
                message: 'User does not have permission: unapproved memberships',
                status: 403,
              });
            }
            return res.send(membership);
          }
          return Promise.reject({ message: 'Membership not found', status: 404 });
        })
        .catch(err => next(err));
    })
    .put(needs('memberships', 'update'), (req, res, next) => {
      Membership
        .findById(req.params.id)
        .then(membership => {
          if (membership) {
            return membership.updateAttributes(req.body, {
              fields: ['reason', 'approved', 'committeeName', 'userDce', 'startDate', 'endDate'],
            });
          }
          return Promise.reject({ message: 'Membership not found', status: 404 });
        })
        .then(membership => res.send(membership))
        .catch(err => next(err));
    })
    .delete(needs('memberships', 'destroy'), (req, res, next) => {
      Membership
        .findById(req.params.id)
        .then(membership => {
          if (membership) {
            return membership.destroy();
          }
          return Promise.reject({ message: 'Membership not found', status: 404 });
        })
        .then(() => res.sendStatus(204))
        .catch(err => next(err));
    });

export default router;
