"""
PlantiuIA — Rotas de Plantas (CRUD)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db, Plant
from models.schemas import PlantCreate, PlantUpdate, PlantResponse

router = APIRouter()


@router.get("/", response_model=list[PlantResponse])
async def list_plants(db: AsyncSession = Depends(get_db)):
    """Lista todas as plantas cadastradas."""
    result = await db.execute(select(Plant).order_by(Plant.created_at.desc()))
    plants = result.scalars().all()
    return plants


@router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(plant_id: int, db: AsyncSession = Depends(get_db)):
    """Retorna detalhes de uma planta."""
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")
    return plant


@router.post("/", response_model=PlantResponse, status_code=201)
async def create_plant(data: PlantCreate, db: AsyncSession = Depends(get_db)):
    """Cadastra uma nova planta."""
    plant = Plant(**data.model_dump())
    db.add(plant)
    await db.commit()
    await db.refresh(plant)
    return plant


@router.put("/{plant_id}", response_model=PlantResponse)
async def update_plant(plant_id: int, data: PlantUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza dados de uma planta."""
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plant, key, value)

    await db.commit()
    await db.refresh(plant)
    return plant


@router.delete("/{plant_id}")
async def delete_plant(plant_id: int, db: AsyncSession = Depends(get_db)):
    """Remove uma planta."""
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Planta não encontrada")

    await db.delete(plant)
    await db.commit()
    return {"message": f"Planta '{plant.name}' removida com sucesso"}
