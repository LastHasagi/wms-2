ENV NIXPACKS_PATH /opt/venv/bin:$NIXPACKS_PATH
COPY . /app/.

# Cria o ambiente virtual
RUN python -m venv --copies /opt/venv

# Ativa o ambiente virtual e instala as dependências
RUN /bin/bash -c "source /opt/venv/bin/activate && pip install -r /app/requirements.txt"