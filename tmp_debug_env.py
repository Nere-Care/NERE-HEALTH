import os
from pydantic import Field
from pydantic_settings import BaseSettings

os.environ['DATABASE_URL'] = 'sqlite:///./tmp.db'
print('env var before import:', os.environ['DATABASE_URL'])

class S(BaseSettings):
    DATABASE_URL_RAW: str = Field('', env='DATABASE_URL')
    model_config = {'env_file': '.env', 'extra': 'ignore'}

print('created settings')
print('DATABASE_URL_RAW:', repr(S().DATABASE_URL_RAW))
print('DATABASE_URL:', repr(S().DATABASE_URL_RAW.replace('postgres://', 'postgresql://', 1)))
