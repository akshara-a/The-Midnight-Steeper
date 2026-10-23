from fastapi import Header, HTTPException

async def get_player_id(x_player_id: str = Header(None, alias="X-Player-ID")) -> str:
    """
    Zero-Auth identity dependency.
    Extracts the player ID from the 'X-Player-ID' request header.
    Raises HTTPException(401) if missing or empty.
    """
    if not x_player_id or not x_player_id.strip():
        raise HTTPException(
            status_code=401,
            detail="Missing required authentication header: X-Player-ID"
        )
    return x_player_id.strip()
