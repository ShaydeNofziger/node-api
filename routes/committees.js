import { Router } from 'express';
import Committee from '../models/committee';
import scopify from '../helpers/scopify';
import { needs } from '../middleware/permissions';
import paginate from '../middleware/paginate';

const router = Router(); // eslint-disable-line new-cap

router
  .route('/')
    .get(paginate, (req, res, next) => {
      const scopes = scopify(req.query, 'name', 'active');
      Committee
        .scope(scopes)
        .findAndCountAll()
        .then(result => res.send({
          total: result.count,
          perPage: req.query.perPage,
          currentPage: req.query.page,
          data: result.rows.map(committee => {
            const c = committee.get({ plain: true });
            Reflect.deleteProperty(c, 'officer');
            return c;
          }),
        }))
        .catch(err => next(err));
    })
    .post(needs('committees', 'create'), (req, res, next) => {
      Committee.create(req.body, { fields: ['name', 'description'] })
        .then(committee => res.status(201).send(committee))
        .catch(err => {
          err.status = 422;
          next(err);
        });
    });

router
  .route('/:id')
    .get((req, res, next) => {
      Committee
        .findById(req.params.id)
        .then(committee => {
          if (committee) {
            return res.send(committee);
          }
          return Promise.reject({ message: 'Committee not found', status: 404 });
        })
        .catch(err => next(err));
    })
    .put(needs('committees', 'update'), (req, res, next) => {
      Committee
        .findById(req.params.id)
        .then(committee => {
          if (committee) {
            return committee.updateAttributes(req.body, {
              fields: ['name', 'description'],
            });
          }
          return Promise.reject({ message: 'Committee not found', status: 404 });
        })
        .then(committee => res.send(committee))
        .catch(err => next(err));
    })
    .delete(needs('committees', 'destroy'), (req, res, next) => {
      Committee
        .findById(req.params.id)
        .then(committee => {
          if (committee) {
            return committee.destroy();
          }
          return Promise.reject({ message: 'Committee not found', status: 404 });
        })
        .then(() => res.sendStatus(204))
        .catch(err => next(err));
    });

export default router;
