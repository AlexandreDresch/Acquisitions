import { Router } from 'express'
import { DealController } from '../controllers/deal.controller.ts'
import { requireAuth } from '../middlewares/require-auth.middleware.ts'

const router = Router()

router.use(requireAuth)

router.post('/listings', DealController.createListing)
router.get('/listings', DealController.getAllListings)
router.get('/listings/my', DealController.getUserListings)
router.get('/listings/:id', DealController.getListing)
router.put('/listings/:id', DealController.updateListing)
router.delete('/listings/:id', DealController.deleteListing)

router.post('/deals', DealController.createDeal)
router.get('/deals', DealController.getUserDeals)
router.get('/deals/:id', DealController.getDeal)
router.put('/deals/:id', DealController.updateDeal)
router.patch('/deals/:id/accept', DealController.acceptDeal)
router.patch('/deals/:id/complete', DealController.completeDeal)

router.post('/deals/:id/messages', DealController.addMessage)
router.get('/deals/:id/messages', DealController.getDealMessages)

export const dealRoutes = router
