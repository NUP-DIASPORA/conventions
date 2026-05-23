from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_admin

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("", response_model=schemas.PaymentOut, status_code=201)
def create_payment(
    payment_in: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    # If linked to a registrant, validate they exist and update flags
    if payment_in.registrant_id is not None:
        registrant = db.query(models.Registrant).filter(
            models.Registrant.id == payment_in.registrant_id
        ).first()
        if not registrant:
            raise HTTPException(status_code=404, detail="Registrant not found")
        if payment_in.product_type == "convention":
            registrant.convention = True
        elif payment_in.product_type == "boat_cruise":
            registrant.boat_cruise = True

    payment = models.Payment(**payment_in.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/unattributed", response_model=List[schemas.PaymentOut])
def list_unattributed_payments(
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Payments not yet linked to a registrant."""
    return db.query(models.Payment).filter(models.Payment.registrant_id == None).all()


@router.patch("/{payment_id}/link", response_model=schemas.PaymentOut)
def link_payment_to_registrant(
    payment_id: int,
    registrant_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Link an unattributed payment to a registrant."""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.registrant_id is not None:
        raise HTTPException(status_code=400, detail="Payment is already linked to a registrant")

    registrant = db.query(models.Registrant).filter(models.Registrant.id == registrant_id).first()
    if not registrant:
        raise HTTPException(status_code=404, detail="Registrant not found")

    payment.registrant_id = registrant_id
    if payment.product_type == "convention":
        registrant.convention = True
    elif payment.product_type == "boat_cruise":
        registrant.boat_cruise = True

    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=204)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
