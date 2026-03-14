export const historyController = (req, res) => {

    res.json([
        { sector: "Producción", machine: "Torno 1", hoursWorked: 3 },
        { sector: "Mantenimiento", machine: "Compresor", hoursWorked: 2 }
    ])

}

export const newMaintenanceController = (req, res) => {

    res.json({
        message: "Mantenimiento registrado"
    })

}

export const dashboardController = (req, res) => {

    res.json({
        totalMaintenances: 24,
        machinesActive: 12
    })

}
