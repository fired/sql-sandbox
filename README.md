
# SQL Sandbox

This repository contains a SQL sandbox environment for practicing and experimenting with SQL queries.

## Features

- Preconfigured database environment
- Sample datasets for querying
- Easy setup and teardown

## Getting Started

1. Clone this repository:
   
   `git clone https://github.com/fired/sql-sandbox.git`

   
2. Navigate to the project directory:
   
   `cd sql-sandbox`

   
4. Create a .env in root directory of app
   ```
   NEXT_PUBLIC_SERVER_URL=http://localhost:3001
   API_PORT=3001
   WEB_PORT=3000
   ```

   
6. Run Docker Compose

   `docker-compose -f docker-compose.coolify.yaml up --build`


## Sample Datasets

- Product
- PC
- Printer

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
