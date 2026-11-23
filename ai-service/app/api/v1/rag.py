from fastapi import APIRouter, Depends, Request

from app.core.exceptions import AIException
from app.core.security import verify_internal_secret
from app.schemas.rag import EmbedRequest, EmbedResponse
from app.services.rag.embedder import OpenAICompatibleEmbedder

router = APIRouter(prefix="/rag", tags=["RAG"])


def get_embedder(request: Request) -> OpenAICompatibleEmbedder:
    embedder = getattr(request.app.state, "embedder", None)
    if not isinstance(embedder, OpenAICompatibleEmbedder):
        raise AIException(
            error_code="EMBEDDING_NOT_INITIALIZED",
            message="Embedder chưa được khởi tạo (lifespan chưa chạy).",
            status_code=503,
        )
    return embedder


@router.post(
    "/embed",
    response_model=EmbedResponse,
    dependencies=[Depends(verify_internal_secret)],
    summary="Sinh vector embedding cho một batch văn bản (stateless)",
)
async def embed_texts(
    payload: EmbedRequest,
    embedder: OpenAICompatibleEmbedder = Depends(get_embedder),  # noqa: B008
) -> EmbedResponse:
    return await embedder.embed(payload.texts)
