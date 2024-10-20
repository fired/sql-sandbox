-- Create the PRODUCT table
CREATE TABLE IF NOT EXISTS PRODUCT (
    MAKER CHAR(1) NOT NULL,
    MODEL INTEGER PRIMARY KEY,
    TYPE TEXT NOT NULL
);

-- Create the PC table
CREATE TABLE IF NOT EXISTS PC (
    MODEL INTEGER PRIMARY KEY,
    SPEED VARCHAR(10),
    RAM INTEGER,
    HD INTEGER,
    PRICE INTEGER,
    FOREIGN KEY (MODEL) REFERENCES PRODUCT(MODEL)
);

-- Create the LAPTOP table
CREATE TABLE IF NOT EXISTS LAPTOP (
    MODEL INTEGER PRIMARY KEY,
    SPEED VARCHAR(10),
    RAM INTEGER,
    HD INTEGER,
    screen VARCHAR(10),
    PRICE INTEGER,
    FOREIGN KEY (MODEL) REFERENCES PRODUCT(MODEL)
);

-- Create the PRINTER table
CREATE TABLE IF NOT EXISTS PRINTER (
    MODEL INTEGER PRIMARY KEY,
    COLOR BOOLEAN,
    TYPE TEXT,
    PRICE INTEGER,
    FOREIGN KEY (MODEL) REFERENCES PRODUCT(MODEL)
);

-- Insert data into PRODUCT table
INSERT OR IGNORE INTO PRODUCT (MAKER, MODEL, TYPE) VALUES
('A', 1001, 'PC'),
('A', 1002, 'PC'),
('A', 1003, 'PC'),
('A', 2004, 'LAPTOP'),
('A', 2005, 'LAPTOP'),
('A', 2006, 'LAPTOP'),
('B', 1004, 'PC'),
('B', 1005, 'PC'),
('B', 1006, 'PC'),
('B', 2007, 'LAPTOP'),
('C', 1007, 'PC'),
('D', 1008, 'PC'),
('D', 1009, 'PC'),
('D', 1010, 'PC'),
('D', 3004, 'PRINTER'),
('D', 3005, 'PRINTER'),
('E', 1011, 'PC'),
('E', 1012, 'PC'),
('E', 1013, 'PC'),
('E', 2001, 'LAPTOP'),
('E', 2002, 'LAPTOP'),
('E', 2003, 'LAPTOP'),
('E', 3001, 'PRINTER'),
('E', 3002, 'PRINTER'),
('E', 3003, 'PRINTER'),
('F', 2008, 'LAPTOP'),
('F', 2009, 'LAPTOP'),
('G', 2010, 'LAPTOP'),
('H', 3006, 'PRINTER'),
('H', 3007, 'PRINTER');

-- Insert data into PC table
INSERT OR IGNORE INTO PC (MODEL, SPEED, RAM, HD, PRICE) VALUES
(1001, 2.66, 1024, 250, 2114),
(1002, 2.10, 512, 250, 995),
(1003, 1.42, 512, 80, 478),
(1004, 2.80, 1024, 250, 649),
(1005, 3.20, 512, 250, 630),
(1006, 3.20, 1024, 320, 1049),
(1007, 2.20, 1024, 200, 510),
(1008, 2.20, 2048, 250, 770),
(1009, 2.00, 1024, 250, 650),
(1010, 2.80, 2048, 300, 770),
(1011, 1.86, 2048, 160, 959),
(1012, 2.80, 1024, 160, 649),
(1013, 3.06, 512, 80, 529);

-- Insert data into LAPTOP table
INSERT OR IGNORE INTO LAPTOP (MODEL, SPEED, RAM, HD, screen, PRICE) VALUES
(2001, 2.00, 2048, 240, 20.1, 3673),
(2002, 1.73, 1024, 80, 17.0, 949),
(2003, 1.80, 512, 60, 15.4, 549),
(2004, 2.00, 512, 60, 13.3, 1150),
(2005, 2.16, 1024, 120, 17.0, 2500),
(2006, 2.00, 2048, 80, 15.4, 1700),
(2007, 1.83, 1024, 120, 13.3, 1429),
(2008, 1.60, 1024, 100, 15.4, 900),
(2009, 1.60, 512, 80, 14.1, 680),
(2010, 2.00, 2048, 160, 15.4, 2300);

-- Insert data into PRINTER table
INSERT OR IGNORE INTO PRINTER (MODEL, COLOR, TYPE, PRICE) VALUES
(3001, TRUE, 'ink-jet', 99),
(3002, FALSE, 'laser', 239),
(3003, TRUE, 'laser', 899),
(3004, TRUE, 'ink-jet', 120),
(3005, FALSE, 'laser', 120),
(3006, TRUE, 'ink-jet', 100),
(3007, TRUE, 'laser', 200);
