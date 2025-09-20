<?php

use App\Enums\ContestType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contests', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->foreignId('gallery_id')->nullable()->constrained('galleries')->nullOnDelete();
            $table->enum('contest_type', ContestType::cases());
            $table->string('location')->nullable();
            $table->dateTime('date')->nullable();
            $table->text('description')->nullable();
            $table->string('standings_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contests');
    }
};
