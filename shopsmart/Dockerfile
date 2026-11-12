# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy project file and restore dependencies
COPY shopsmart.csproj .
RUN dotnet restore

# Copy source code
COPY . .

# Publish application
RUN dotnet publish -c Release -o /app/publish --no-restore


# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# ASP.NET Core container port
EXPOSE 8080

ENTRYPOINT ["dotnet", "shopsmart.dll"]