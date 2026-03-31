import 'package:flutter/material.dart';

void main() {
  runApp(const NereApp());
}

class NereApp extends StatelessWidget {
  const NereApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NERE App Mobile',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('NERE Mobile'),
      ),
      body: const Center(
        child: Text(
          'Bienvenue dans NERE App Mobile',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18),
        ),
      ),
    );
  }
}
