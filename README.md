Taller de docker BD2
Integrantes:
Sebastián Agüero Brenes
José Daniel Monterrosa Quiros
Sebastián Rodrigo Donoso Chaves

Pasos para el testeo

Con el docker instalado y una conexión a internet

1. Abrimos una terminal y nos dirigimos a la capeta de "tournament-manager-api" y ejecutamos estos comandos:

	docker-compose build
	
	docker-compose up -d

Esto construye las imágenes, luego levanta y arranca los contenedores del api, el mongo y el kafka

2. Luego en la terminal nos dirigimos a la carpeta de "tournament-manager-ui" y ejecutamos estos comandos:

	docker-compose build

	docker-compose up -d

Esto construye las imágenes, luego levanta y arranca los contenedores del Angular

3. Luego en la terminal nos dirigimos a la carpeta de "kafka-consumer-job" y ejecutamos estos comandos:

	docker-compose build

	docker-compose up -d

Crea, levanta y arranca el contenedor del Job y lo conecta al kafka

4. Luego en la terminal ponemos los siguientes comandos:

	docker exec my-kafka kafka-topics --list --bootstrap-server localhost:9092

	docker logs tournament-kafka-consumer -f

Esto quedara esperando al Job que imprime cuando el kafka recibe algo

5. Con el Postman, importamos el archivo de "Tournament.postman_collection.json", una vez importado tendremos un post "Create tournament" que nos permite crear un torneo, este lo ejecutamos de primero, una vez creado el torneo, pasamos al get "Fetch tournament", este lo ejetucamos y nos devuelve los participantes y el torneo con su ID, el cual copiaremos el ID para ir al post "Registrar" donde podemos  insertar participantes cambiando los parámetros de tournamentId por el que copiamos, y ademas los: id, name, weight y age del participantes.

6. En la consola donde pusimos el "docker logs tournament-kafka-consumer -f" debería de salirnos la información de los participantes que insertemos esto gracias al Job conectado con kafka.



