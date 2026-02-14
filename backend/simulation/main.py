import asyncio
import json
import random
import time
from fastapi import FastAPI
from redis import asyncio as aioredis
import os

app = FastAPI(title="Asset Simulation Service (Layer 3)")

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# --- Simulation Logic ---

class AssetSimulator:
    def __init__(self, asset_type, count, redis):
        self.asset_type = asset_type
        self.count = count
        self.redis = redis
        self.assets = [self._init_asset(i) for i in range(count)]

    def _init_asset(self, i):
        return {
            "id": f"{self.asset_type.upper()}-{100+i}",
            "lat": 34.0 + (random.random() - 0.5),
            "lng": 65.0 + (random.random() - 0.5),
            "status": "OPERATIONAL",
            "fuel": 100
        }

    def _update_asset(self, asset):
        # Human-like movement
        asset["lat"] += (random.random() - 0.5) * 0.01
        asset["lng"] += (random.random() - 0.5) * 0.01
        asset["fuel"] = max(0, asset["fuel"] - 0.1)
        
        # Random status change
        if random.random() > 0.99:
            asset["status"] = "ENGAGED" if random.random() > 0.5 else "MAINTENANCE"
        elif random.random() > 0.95:
             asset["status"] = "OPERATIONAL"
             
        return asset

    async def run(self):
        while True:
            for asset in self.assets:
                self._update_asset(asset)
                # Publish to Redis Channel
                message = json.dumps({
                    "type": self.asset_type,
                    "data": asset,
                    "timestamp": time.time()
                })
                # PubSub channel: "telemetry"
                await self.redis.publish("telemetry", message)
            
            await asyncio.sleep(1) # Physics tick rate

@app.on_event("startup")
async def startup_event():
    redis = await aioredis.from_url(REDIS_URL)
    
    # Start Simulators
    land_sim = AssetSimulator("land", 5, redis)
    air_sim = AssetSimulator("air", 3, redis)
    naval_sim = AssetSimulator("naval", 2, redis)
    
    asyncio.create_task(land_sim.run())
    asyncio.create_task(air_sim.run())
    asyncio.create_task(naval_sim.run())
    
    print("Simulation Services Started: Land, Air, Naval")

@app.get("/")
async def root():
    return {"status": "Simulation Running", "assets": "Land:5, Air:3, Naval:2"}
