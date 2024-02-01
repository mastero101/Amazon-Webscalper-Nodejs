const mysql = require("mysql");
const axios = require("axios");
const cheerio = require("cheerio");

//require('dotenv').config();

const connection2 = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: 3306,
  ssl: true
});

const connection = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "pcparts",
  port: 3306,
  ssl: true
});

// Realizar la conexión a la base de datos
connection.connect((error) => {
  if (error) {
    console.error("Error al conectar a la base de datos: ", error);
  } else {
    console.log("Conexión exitosa a la base de datos");
    // Iniciar la ejecución del script
    runScript();
  }
});

// Función para ejecutar fetchDataAndUpdateDatabase() cada 2 segundos
function runScript() {
  fetchDataAndUpdateDatabase(); // Ejecutar la función inmediatamente
  let cycleCount = 1; // Inicializar el contador de ciclos

  const interval = setInterval(() => {
    console.log(`Inicio del ciclo ${cycleCount}`);

    let countdown = 10; // Iniciar el contador en 10 segundos
    const cycleStartTime = Date.now(); // Obtener el tiempo de inicio del ciclo
    const cycleInterval = setInterval(() => {
      console.log(`Reinicio en ${countdown} segundos`);
      countdown--; // Decrementar el contador

      if (countdown === 0) {
        clearInterval(cycleInterval); // Detener el contador cuando llegue a cero
        const cycleEndTime = Date.now(); // Obtener el tiempo de finalización del ciclo
        const cycleDuration = (cycleEndTime - cycleStartTime) / 1000; // Calcular la duración del ciclo en segundos
        console.log(`Ciclo ${cycleCount} completado en ${cycleDuration} segundos`);
        cycleCount++; // Incrementar el contador de ciclos

        fetchDataAndUpdateDatabase(); // Ejecutar la función
      }
    }, 1000); // Contar cada segundo (1000 milisegundos)
  }, 11000); // Esperar 11 segundos antes de iniciar el siguiente ciclo (10 segundos de cuenta regresiva + 1 segundo adicional)
}

function fetchDataAndUpdateDatabase() {
  // Obtener los IDs de la tabla componentes
  const query = `SELECT id, url FROM amazon`;
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error al consultar la base de datos: ", error);
    } else {
      console.log("Número de registros obtenidos: ", results.length);

      // Iterar sobre los resultados y hacer la solicitud HTTP y actualizar la base de datos para cada registro
      results.forEach((result, index) => {
        const { id, url } = result;

        setTimeout(() => {
          // Verificar si la URL contiene "t.ly/"
          if (url && url.includes("amazon")) {
            // Realizar el webscraping adicional
            axios.get(url)
              .then((response) => {
                const html = response.data;
                const $ = cheerio.load(html);
                const priceText = $(".a-price-whole").text(); // Obtener el valor del elemento adicional
                const priceValues = priceText.split('.');
                const firstPriceValue = priceValues[0];
                const formattedPriceValue = firstPriceValue.replace(',', ''); // Corregir el formato del precio
                console.log(formattedPriceValue);

                // Actualizar la base de datos con el valor adicional
                const updateQuery = `UPDATE amazon SET precio = '${formattedPriceValue}' WHERE id = ${id}`;
                connection.query(updateQuery, (error, results) => {
                  if (error) {
                    console.error("Error al actualizar la base de datos: ", error);
                  } else {
                    console.log(`[${index + 1}] Actualización exitosa de la base de datos con el valor adicional`);
                  }
                });
              })
              .catch((error) => {
                console.error(`[${index + 1}] Error al hacer la solicitud HTTP adicional: ${error}`);
              });
          }
        }, index * 10); // Retraso de 100 ms entre cada solicitud (index * 100 milisegundos)
      });
    }
  });
}
