from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    Model cơ sở cho toàn bộ Pydantic Schemas trong ai-service.
    Tự động chuyển đổi snake_case trong code Python sang camelCase trên Wire JSON.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
    )
